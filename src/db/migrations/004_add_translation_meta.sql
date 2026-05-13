-- word_translations tablosuna kaynak ve güven bilgisi eklenir
ALTER TABLE word_translations ADD COLUMN validated_by TEXT;
ALTER TABLE word_translations ADD COLUMN confidence    REAL;
