// Migration: Create education table
exports.up = function (knex) {
  return knex.schema.createTable('education', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.string('institution', 200).notNullable();
    table.string('degree', 200);
    table.string('field', 200);
    table.date('start_date');
    table.date('end_date');
    table.decimal('cgpa', 3, 2);
    table.string('location', 200);
    table.boolean('is_current').defaultTo(false);
    table.integer('order_index').defaultTo(0);
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('education');
};
