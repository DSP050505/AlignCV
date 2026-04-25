// Migration: Create skills table
exports.up = function (knex) {
  return knex.schema.createTable('skills', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.string('category', 100);    // 'Languages' | 'Frameworks' | 'Tools' | 'Libraries'
    table.string('name', 100).notNullable();
    table.string('level', 50);         // 'beginner' | 'intermediate' | 'advanced'
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('skills');
};
