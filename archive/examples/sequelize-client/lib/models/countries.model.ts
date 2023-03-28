import { Table, Column, Model, PrimaryKey } from "sequelize-typescript";

@Table({ modelName: "countries", timestamps: false })
export default class Country extends Model {
  @PrimaryKey
  @Column
  country_id: number;

  @Column
  country_name: string;
}
