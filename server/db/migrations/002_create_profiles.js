// Migration: Create profiles table
exports.up = function (knex) {
  return knex.schema.createTable('profiles', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE').unique();
    table.string('headline', 200);
    table.string('email', 200);
    table.string('phone', 30);
    table.string('github', 100);
    table.string('linkedin', 100);
    table.string('leetcode', 100);
    table.string('portfolio', 200);
    table.jsonb('other_links').defaultTo('[]');
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('profiles');
};
