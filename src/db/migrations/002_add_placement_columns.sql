-- Migration 002: Placement test için ek kolonlar
-- profiles → placement_done, current_level
-- placement_questions → skill_area

ALTER TABLE profiles
  ADD COLUMN placement_done  INTEGER NOT NULL DEFAULT 0;

ALTER TABLE profiles
  ADD COLUMN current_level   TEXT    DEFAULT NULL;

ALTER TABLE placement_questions
  ADD COLUMN skill_area      TEXT    NOT NULL DEFAULT 'vocabulary'
             CHECK(skill_area IN ('vocabulary','grammar'));
