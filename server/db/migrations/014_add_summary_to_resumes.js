exports.up = function(knex) {
  return knex.schema.alterTable('resumes', (table) => {
    table.text('summary'); // The 3-line foreword
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('resumes', (table) => {
    table.dropColumn('summary');
  });
};
