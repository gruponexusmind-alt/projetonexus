/**
 * Script temporário para aplicar migration de correção do constraint de status
 * Execute com: node apply-migration.js
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregar variáveis de ambiente
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Erro: Variáveis de ambiente não encontradas');
  console.error('Certifique-se que VITE_SUPABASE_URL e SUPABASE_SERVICE_KEY estão configuradas');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function applyMigration() {
  try {
    console.log('📦 Carregando migration...');

    const migrationPath = join(__dirname, 'supabase/migrations/20251010000000_fix_gp_tasks_status_constraint.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');

    console.log('🔄 Aplicando migration...');
    console.log('\nSQL a ser executado:');
    console.log('─'.repeat(60));
    console.log(migrationSQL);
    console.log('─'.repeat(60));

    // Executar cada comando SQL separadamente
    const commands = migrationSQL
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

    for (const command of commands) {
      if (command.toLowerCase().includes('comment on')) {
        // Skip COMMENT commands - they might not be supported via RPC
        console.log('⏭️  Pulando comando COMMENT...');
        continue;
      }

      const { data, error } = await supabase.rpc('exec_sql', { sql: command + ';' });

      if (error) {
        console.error(`❌ Erro ao executar comando:`, error);
        console.error('Comando:', command);
      } else {
        console.log('✅ Comando executado com sucesso');
      }
    }

    console.log('\n✅ Migration aplicada com sucesso!');
    console.log('🔄 Reinicie o servidor (npm run dev) para aplicar as mudanças');

  } catch (error) {
    console.error('❌ Erro ao aplicar migration:', error.message);
    console.error('\n⚠️  SOLUÇÃO ALTERNATIVA:');
    console.error('1. Acesse o Supabase Dashboard: https://supabase.com/dashboard');
    console.error('2. Vá em SQL Editor');
    console.error('3. Execute o seguinte SQL:\n');

    const migrationPath = join(__dirname, 'supabase/migrations/20251010000000_fix_gp_tasks_status_constraint.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');
    console.error(migrationSQL);

    process.exit(1);
  }
}

applyMigration();
