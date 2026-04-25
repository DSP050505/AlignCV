// Migration: Create certifications table
exports.up = function (knex) {
  return knex.schema.createTable('certifications', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.string('name', 300).notNullable();
    table.string('issuer', 200);
    table.date('issued_at');
    table.date('expires_at');
    table.string('url', 500);
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('certifications');
};
