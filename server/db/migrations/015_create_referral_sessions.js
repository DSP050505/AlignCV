exports.up = function(knex) {
  return knex.schema.createTable('referral_sessions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.uuid('job_id').references('id').inTable('jd_analyses').onDelete('SET NULL');
    table.uuid('resume_id').references('id').inTable('resumes').onDelete('SET NULL');
    table.string('company_name', 200);
    table.string('role_title', 200);
    table.integer('connections_found').defaultTo(0);
    table.jsonb('connections_data');
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('referral_sessions');
};
