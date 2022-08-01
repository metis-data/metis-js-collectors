import { Table, Column, Model, PrimaryKey } from "sequelize-typescript";

@Table({ modelName: "cities", timestamps: false })
export default class City extends Model {
  @PrimaryKey
  @Column
  city_id: number;

  @Column
  city_name: string;

  @Column
  state_province_id: number;

  @Column
  latest_recorded_population: number;
}
