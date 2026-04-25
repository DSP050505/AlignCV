// Migration: Create experiences table
exports.up = function (knex) {
  return knex.schema.createTable('experiences', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.string('company', 200).notNullable();
    table.string('role', 200).notNullable();
    table.string('type', 50).defaultTo('job');       // 'job' | 'internship' | 'freelance'
    table.string('location', 200);
    table.date('start_date');
    table.date('end_date');
    table.boolean('is_current').defaultTo(false);
    table.jsonb('bullets').defaultTo('[]');            // ["bullet 1", "bullet 2"]
    table.specificType('tech_stack', 'TEXT[]');
    table.integer('order_index').defaultTo(0);
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('experiences');
};
