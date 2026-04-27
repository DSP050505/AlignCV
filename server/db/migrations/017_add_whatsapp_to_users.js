exports.up = function(knex) {
  return knex.schema.alterTable('users', (table) => {
    table.string('whatsapp_code').unique();
    table.string('whatsapp_phone').unique();
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('users', (table) => {
    table.dropColumn('whatsapp_code');
    table.dropColumn('whatsapp_phone');
  });
};
