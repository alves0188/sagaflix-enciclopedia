import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://guecsoghyqvssdvednnv.supabase.co';
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;

if (!SUPABASE_SERVICE_ROLE) {
  console.error('\n[ERRO] Variável de ambiente SUPABASE_SERVICE_ROLE não configurada.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

const isValidUUID = (str) => {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
};

async function run() {
  console.log('--- MIGRATION SCRIPT START ---');
  
  console.log('Loading sagaflix_db JSON data...');
  const { data: dbData, error: dbErr } = await supabase.from('sagaflix_db').select('data').eq('id', 1).single();
  if (dbErr) {
    console.error('Error loading sagaflix_db JSON:', dbErr);
    return;
  }
  
  const db = dbData.data || {};
  
  console.log('Verifying if new relational tables exist in Supabase...');
  const { error: testErr } = await supabase.from('banners').select('id').limit(1);
  if (testErr) {
    console.error('\n[AVISO] As novas tabelas relacionais ainda não foram criadas no Supabase.');
    return;
  }
  
  // 2. Migrate Banners
  if (db.banners && db.banners.length > 0) {
    console.log(`Migrating ${db.banners.length} banners...`);
    const bannerPayloads = db.banners.map((b, idx) => ({
      id: b.id || `banner_${Date.now()}_${idx}`,
      title: b.title || '',
      description: b.description || '',
      image_url: b.imageUrl || '',
      action_url: b.actionUrl || '',
      action_text: b.actionText || '',
      order_index: idx,
      active: b.active !== undefined ? b.active : true
    }));
    const { error: err } = await supabase.from('banners').upsert(bannerPayloads);
    if (err) console.error('Error inserting banners:', err);
    else console.log('Banners successfully migrated!');
  }
  
  // 3. Migrate Author Requests
  if (db.authorRequests && db.authorRequests.length > 0) {
    console.log(`Migrating ${db.authorRequests.length} author requests...`);
    const requestPayloads = [];
    for (const r of db.authorRequests) {
      const userId = r.userId || r.authorId;
      requestPayloads.push({
        id: r.id || `req_${Date.now()}_${Math.floor(Math.random()*1000)}`,
        user_id: isValidUUID(userId) ? userId : null,
        email: r.email || 'suporte@sagaflix.com.br',
        name: r.name || 'Autor Sem Nome',
        nickname: r.nickname || '',
        about: r.about || '',
        book_title: r.bookTitle || '',
        synopsis: r.synopsis || '',
        sample_text: r.sampleText || '',
        status: r.status || 'pending',
        date: r.date || new Date().toLocaleDateString('pt-BR')
      });
    }
    const { error: err } = await supabase.from('author_requests').upsert(requestPayloads);
    if (err) console.error('Error inserting author requests:', err);
    else console.log('Author requests successfully migrated!');
  }
  
  // 4. Migrate Audit Logs
  if (db.auditLogs && db.auditLogs.length > 0) {
    console.log(`Migrating ${db.auditLogs.length} audit logs...`);
    const logPayloads = db.auditLogs.map((l, idx) => ({
      id: l.id || `audit_${Date.now()}_${idx}`,
      curator_id: isValidUUID(l.curatorId) ? l.curatorId : null,
      curator_name: l.curatorName || 'Curador Anônimo',
      action: l.action || 'Ação desconhecida',
      details: l.details || '',
      date: l.date || new Date().toLocaleString('pt-BR')
    }));
    const { error: err } = await supabase.from('audit_logs').upsert(logPayloads);
    if (err) console.error('Error inserting audit logs:', err);
    else console.log('Audit logs successfully migrated!');
  }
  
  // 5. Migrate Gamification Badges
  if (db.gamificationBadges && db.gamificationBadges.length > 0) {
    console.log(`Migrating ${db.gamificationBadges.length} gamification badges...`);
    const badgePayloads = db.gamificationBadges.map(g => ({
      id: g.id,
      name: g.name,
      description: g.desc || '',
      tier: g.tier || 'bronze',
      xp: g.xp || 0,
      icon: g.icon || '',
      bg_color: g.bg || '',
      icon_color: g.ic || '',
      prog_max: g.progMax || 1,
      trigger_type: g.trigger || ''
    }));
    const { error: err } = await supabase.from('gamification_badges').upsert(badgePayloads);
    if (err) console.error('Error inserting badges:', err);
    else console.log('Gamification badges successfully migrated!');
  }
  
  console.log('--- MIGRATION SCRIPT COMPLETED ---');
}
run();
