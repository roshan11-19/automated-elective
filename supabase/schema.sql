-- ==============================================================================
-- AUTOMATION FOR ELECTIVE SYSTEM — CLEAN SUPABASE POSTGRESQL SCHEMA
-- ==============================================================================

-- Reset existing tables cleanly
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.allotments CASCADE;
DROP TABLE IF EXISTS public.elective_preferences CASCADE;
DROP TABLE IF EXISTS public.subjects CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.selection_periods CASCADE;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. PROFILES TABLE (Only Coordinator & Added Students Can Log In)
-- ------------------------------------------------------------------------------
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    roll_number VARCHAR(50) UNIQUE,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'coordinator')),
    branch VARCHAR(50),
    section VARCHAR(10),
    regulation VARCHAR(20) DEFAULT 'Autonomous',
    admitted_batch VARCHAR(20) DEFAULT '2022-2026',
    semester INTEGER NOT NULL DEFAULT 5,
    password_changed BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 2. SUBJECTS TABLE (PE and OE Managed Separately)
-- ------------------------------------------------------------------------------
CREATE TABLE public.subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject_code VARCHAR(50) NOT NULL UNIQUE,
    subject_name VARCHAR(255) NOT NULL,
    elective_type VARCHAR(10) NOT NULL CHECK (elective_type IN ('PE', 'OE')),
    regulation VARCHAR(20) DEFAULT 'Autonomous',
    admitted_batch VARCHAR(20) DEFAULT '2022-2026',
    branch VARCHAR(50), -- Specific Branch for PE (e.g. 'CSE'), 'ALL' for Open Elective
    semester INTEGER NOT NULL DEFAULT 5,
    seats INTEGER NOT NULL CHECK (seats >= 0),
    available_seats INTEGER NOT NULL CHECK (available_seats >= 0),
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 3. ELECTIVE PREFERENCES TABLE (Locked Once Submitted)
-- ------------------------------------------------------------------------------
CREATE TABLE public.elective_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    elective_type VARCHAR(10) NOT NULL CHECK (elective_type IN ('PE', 'OE')),
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    priority INTEGER NOT NULL CHECK (priority > 0),
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_student_type_subject UNIQUE (student_id, elective_type, subject_id),
    CONSTRAINT uq_student_type_priority UNIQUE (student_id, elective_type, priority)
);

-- ------------------------------------------------------------------------------
-- 4. ALLOTMENTS TABLE (Instant Real-time FIFO Allotment)
-- ------------------------------------------------------------------------------
CREATE TABLE public.allotments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    roll_number VARCHAR(50),
    student_email VARCHAR(255) NOT NULL,
    elective_type VARCHAR(10) NOT NULL CHECK (elective_type IN ('PE', 'OE')),
    subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
    priority_selected INTEGER,
    status VARCHAR(30) NOT NULL DEFAULT 'ALLOTTED' CHECK (status IN ('ALLOTTED', 'NOT_ALLOTTED', 'WAITLISTED', 'CANCELLED')),
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    allotted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_student_elective_allotment UNIQUE (student_id, elective_type)
);

-- ------------------------------------------------------------------------------
-- 5. AUDIT LOGS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    coordinator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    student_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    old_value TEXT,
    new_value TEXT,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- INDEXES FOR INSTANT FIFO LOOKUPS
-- ------------------------------------------------------------------------------
CREATE INDEX idx_preferences_fifo ON public.elective_preferences (elective_type, submitted_at ASC, id ASC);
CREATE INDEX idx_allotments_student ON public.allotments (student_id, elective_type);
CREATE INDEX idx_subjects_type ON public.subjects (elective_type, branch, semester);

-- ------------------------------------------------------------------------------
-- 6. ATOMIC REAL-TIME FIFO SUBMISSION & ALLOTMENT ENGINE (POSTGRESQL RPC)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.submit_and_allot_preferences(
    p_student_id UUID,
    p_elective_type VARCHAR(10),
    p_subject_priorities JSONB -- Array of { subject_id, priority }
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_student RECORD;
    v_pref RECORD;
    v_subj RECORD;
    v_allotted BOOLEAN := FALSE;
    v_submitted_at TIMESTAMPTZ := NOW();
    v_assigned_subject_id UUID := NULL;
    v_assigned_priority INT := NULL;
    v_status VARCHAR(30) := 'WAITLISTED';
BEGIN
    -- 1. Verify student exists
    SELECT * INTO v_student FROM public.profiles WHERE id = p_student_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Student not found in registered database.';
    END IF;

    -- 2. Prevent re-submission if already submitted and locked
    IF EXISTS (SELECT 1 FROM public.allotments WHERE student_id = p_student_id AND elective_type = p_elective_type) THEN
        RAISE EXCEPTION 'Elective preferences are already submitted and locked.';
    END IF;

    -- 3. Delete any draft preferences and insert new locked preferences
    DELETE FROM public.elective_preferences WHERE student_id = p_student_id AND elective_type = p_elective_type;

    FOR v_pref IN SELECT * FROM jsonb_to_recordset(p_subject_priorities) AS x(subject_id UUID, priority INT) ORDER BY priority ASC
    LOOP
        INSERT INTO public.elective_preferences (
            student_id,
            elective_type,
            subject_id,
            priority,
            submitted_at
        ) VALUES (
            p_student_id,
            p_elective_type,
            v_pref.subject_id,
            v_pref.priority,
            v_submitted_at
        );

        -- Check seat availability atomically in priority order
        IF NOT v_allotted THEN
            SELECT id, available_seats INTO v_subj
            FROM public.subjects
            WHERE id = v_pref.subject_id AND available_seats > 0
            FOR UPDATE;

            IF FOUND AND v_subj.available_seats > 0 THEN
                -- Decrement seat atomically
                UPDATE public.subjects
                SET available_seats = available_seats - 1,
                    updated_at = NOW()
                WHERE id = v_subj.id;

                v_assigned_subject_id := v_subj.id;
                v_assigned_priority := v_pref.priority;
                v_status := 'ALLOTTED';
                v_allotted := TRUE;
            END IF;
        END IF;
    END LOOP;

    -- 4. Create Allotment record immediately
    INSERT INTO public.allotments (
        student_id,
        roll_number,
        student_email,
        elective_type,
        subject_id,
        priority_selected,
        status,
        submitted_at,
        allotted_at
    ) VALUES (
        p_student_id,
        v_student.roll_number,
        v_student.email,
        p_elective_type,
        v_assigned_subject_id,
        v_assigned_priority,
        v_status,
        v_submitted_at,
        NOW()
    );

    RETURN jsonb_build_object(
        'success', true,
        'status', v_status,
        'allotted_subject_id', v_assigned_subject_id,
        'priority_selected', v_assigned_priority,
        'submitted_at', v_submitted_at
    );
END;
$$;

-- ------------------------------------------------------------------------------
-- 7. ROW LEVEL SECURITY (RLS) POLICIES — OPEN READ/WRITE FOR CONFIGURED APP
-- ------------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.elective_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.allotments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Public insert profiles" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update profiles" ON public.profiles FOR UPDATE USING (true);
CREATE POLICY "Public delete profiles" ON public.profiles FOR DELETE USING (true);

CREATE POLICY "Public read subjects" ON public.subjects FOR SELECT USING (true);
CREATE POLICY "Public manage subjects" ON public.subjects FOR ALL USING (true);

CREATE POLICY "Public read preferences" ON public.elective_preferences FOR SELECT USING (true);
CREATE POLICY "Public insert preferences" ON public.elective_preferences FOR ALL USING (true);

CREATE POLICY "Public read allotments" ON public.allotments FOR SELECT USING (true);
CREATE POLICY "Public manage allotments" ON public.allotments FOR ALL USING (true);

CREATE POLICY "Public manage audit_logs" ON public.audit_logs FOR ALL USING (true);

-- ------------------------------------------------------------------------------
-- 8. DEFAULT SEED DATA (Only Clean Academic Coordinator Account)
-- ------------------------------------------------------------------------------
INSERT INTO public.profiles (id, email, roll_number, name, role, branch, section, regulation, admitted_batch, semester, password_changed)
VALUES 
('c0000000-0000-0000-0000-000000000001', 'coordinator@college.edu', 'COORD-01', 'Academic Coordinator', 'coordinator', 'CSE', 'Admin', 'Autonomous', '2024-2025', 5, true)
ON CONFLICT (email) DO NOTHING;
