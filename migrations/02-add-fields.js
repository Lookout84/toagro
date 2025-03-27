'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Додавання поля для зберігання додаткових характеристик продукту
    await queryInterface.addColumn('Products', 'specifications', {
      type: Sequelize.JSONB,
      allowNull: true
    });

    // Додавання поля для зберігання інформації про доставку
    await queryInterface.addColumn('Orders', 'deliveryService', {
      type: Sequelize.ENUM('nova_poshta', 'ukrposhta', 'delivery', 'pickup'),
      allowNull: true
    });

    // Додавання поля для зберігання коментаря до замовлення
    await queryInterface.addColumn('Orders', 'comment', {
      type: Sequelize.TEXT,
      allowNull: true
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('Products', 'specifications');
    await queryInterface.removeColumn('Orders', 'deliveryService');
    await queryInterface.removeColumn('Orders', 'comment');
  }
};