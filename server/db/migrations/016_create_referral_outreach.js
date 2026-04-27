exports.up = function(knex) {
  return knex.schema.createTable('referral_outreach', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.uuid('session_id').references('id').inTable('referral_sessions').onDelete('CASCADE');
    table.string('person_name', 200);
    table.string('person_linkedin_url', 500);
    table.string('person_role', 200);
    table.string('company_name', 200);
    table.text('message_text');
    table.uuid('resume_id').references('id').inTable('resumes').onDelete('SET NULL');
    table.string('connection_type', 20).defaultTo('1st');
    table.string('status', 50).defaultTo('prepared');
    table.timestamp('sent_at', { useTz: true });
    table.timestamp('responded_at', { useTz: true });
    table.text('notes');
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('referral_outreach');
};
