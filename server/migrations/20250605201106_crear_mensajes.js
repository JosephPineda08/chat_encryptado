// migrations/xxxxxx_crear_mensajes.js
exports.up = function(knex) {
  return knex.schema.createTable('mensajes', (table) => {
    table.increments('id').primary();
    table.integer('emisor_id').notNullable().references('id').inTable('usuarios').onDelete('CASCADE');
    table.integer('receptor_id').nullable().references('id').inTable('usuarios').onDelete('CASCADE');
    table.text('texto_cifrado').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('mensajes');
};
