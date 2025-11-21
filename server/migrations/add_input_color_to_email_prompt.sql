-- Agregar columna input_color a email_prompt_settings
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='email_prompt_settings' AND column_name='input_color') THEN
    ALTER TABLE email_prompt_settings ADD COLUMN input_color VARCHAR(7) DEFAULT '#000000';
  END IF;
END $$;
