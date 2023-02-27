import { Inject, Injectable } from '@nestjs/common';
import { SequelizeClient } from 'sequelize-client';
import { Sequelize } from 'sequelize-typescript';

@Injectable()
export class SequelizeService extends SequelizeClient {
  constructor(@Inject('SEQUELIZE') sequelize: Sequelize) {
    super(sequelize);
  }
}
