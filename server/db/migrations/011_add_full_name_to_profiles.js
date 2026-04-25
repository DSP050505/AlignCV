exports.up = function (knex) {
  return knex.schema.alterTable('profiles', (table) => {
    table.string('full_name', 255).nullable();
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('profiles', (table) => {
    table.dropColumn('full_name');
  });
};
