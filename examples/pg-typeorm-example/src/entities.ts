import { Entity, PrimaryGeneratedColumn, Column, Unique } from 'typeorm';

@Entity()
@Unique(['firstName', 'lastName'])
export class Person {
  @PrimaryGeneratedColumn()
  readonly id: number;

  @Column()
  readonly firstName: string;

  @Column()
  readonly lastName: string;

  @Column()
  readonly age: number;
}
