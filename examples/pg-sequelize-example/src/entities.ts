import { DataTypes } from 'sequelize';

export const PersonDefinition = {
  def: {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    firstName: {
      type: DataTypes.STRING,
      unique: 'person_unique_first_last',
    },
    lastName: {
      type: DataTypes.STRING,
      unique: 'person_unique_first_last',
    },
    age: {
      type: DataTypes.INTEGER,
    },
  },
  options: {
    tableName: 'person',
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['firstName', 'lastName'],
        name: 'person_unique_first_last',
      },
    ],
  },
};
