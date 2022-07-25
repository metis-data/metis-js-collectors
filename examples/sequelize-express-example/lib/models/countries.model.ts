import { Table, Column, Model, PrimaryKey } from "sequelize-typescript";

@Table({ modelName: "countries", timestamps: false })
export default class Countries extends Model {
  @PrimaryKey
  @Column
  country_id: number;

  @Column
  country_name: string;
}
