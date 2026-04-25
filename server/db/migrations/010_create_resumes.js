// Migration: Create resumes table
exports.up = function (knex) {
  return knex.schema.createTable('resumes', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.uuid('jd_analysis_id').references('id').inTable('jd_analyses');
    table.string('title', 300);                       // "Software Engineer @ Google"
    table.jsonb('selected_projects').defaultTo('[]');  // [{ project_id, tailored_bullets }]
    table.jsonb('selected_experiences').defaultTo('[]');
    table.jsonb('selected_skills').defaultTo('[]');
    table.jsonb('added_skills').defaultTo('[]');       // Skills added via gap advisor
    table.text('html_source');                          // Filled template HTML
    table.text('latex_source');                          // LaTeX source (future)
    table.string('pdf_path', 500);
    table.integer('ats_score');                          // 0-100
    table.jsonb('ats_breakdown').defaultTo('{}');
    table.jsonb('ats_missing_keywords').defaultTo('[]');
    table.integer('version_number').defaultTo(1);
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());

    table.index('user_id', 'idx_resumes_user');
    table.index('jd_analysis_id', 'idx_resumes_jd');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('resumes');
};
