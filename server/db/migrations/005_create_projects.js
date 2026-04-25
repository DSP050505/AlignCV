// Migration: Create projects table
exports.up = function (knex) {
  return knex.schema.createTable('projects', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.string('title', 200).notNullable();
    table.text('description');
    table.jsonb('bullets').defaultTo('[]');
    table.specificType('tech_stack', 'TEXT[]');
    table.date('start_date');
    table.date('end_date');
    table.string('repo_url', 500);
    table.string('live_url', 500);
    table.integer('order_index').defaultTo(0);
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('projects');
};
