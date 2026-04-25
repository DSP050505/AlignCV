// Migration: Create jd_analyses table
exports.up = function (knex) {
  return knex.schema.createTable('jd_analyses', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.text('raw_jd').notNullable();
    table.string('role_title', 200);
    table.string('company_name', 200);
    table.jsonb('required_skills').defaultTo('[]');
    table.jsonb('preferred_skills').defaultTo('[]');
    table.jsonb('keywords').defaultTo('[]');
    table.string('seniority', 50);       // 'fresher' | 'junior' | 'mid' | 'senior'
    table.string('domain', 100);          // 'frontend' | 'backend' | 'fullstack' | etc.
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());

    table.index('user_id', 'idx_jd_user');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('jd_analyses');
};
