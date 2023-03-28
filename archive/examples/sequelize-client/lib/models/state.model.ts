import { Table, Column, Model, PrimaryKey } from "sequelize-typescript";

@Table({ modelName: "state_provinces", timestamps: false })
export default class StatesProvince extends Model {
  @PrimaryKey
  @Column
  state_province_id: number;

  @Column
  state_province_code: string;

  @Column
  state_province_name: string;
}
