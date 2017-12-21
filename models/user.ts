"use strict";

import {
  Entity, BaseEntity, Index,
  Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn,
  OneToMany,
} from "typeorm";
import * as bcrypt from "bcrypt";
import config from "../lib/config";
import IPermission from "./IPermission";
import * as uuid from "uuid/v4";
import { serialize, Serialize } from "cerialize";
import Session from "./session";

@Entity()
@Index("email_unique_with_deletion", ["email", "deleteToken"], { unique: true })
export default class User extends BaseEntity {
  constructor(email: string) {
    super();
    this.email = email;
  }
  @PrimaryGeneratedColumn("uuid")
  @serialize
  public id: string;
  @Column({ type: "varchar", length: 50, nullable: false })
  @serialize
  public email: string;
  @Column({ name: "password", type: "varchar" })
  public hashedPassword: string;
  public static hashPassword = (password: string) =>
    bcrypt.hash(password, config.get("password_hash_rounds"))
  public setPassword = async (password: string) => {
    this.hashedPassword = await User.hashPassword(password);
  }
  public checkPassword = async (password: string) =>
    bcrypt.compare(password, this.hashedPassword)
  @Column({ type: "jsonb" })
  @serialize
  public permissions: IPermission = { admin: false };
  @OneToMany(() => Session, (session) => session.user)
  public sessions: Promise<Session[]>;
  @CreateDateColumn()
  @serialize
  public createdAt: Date;
  @UpdateDateColumn()
  @serialize
  public updatedAt: Date;
  @Column({ name: "delete_token", type: "uuid", nullable: true })
  public deleteToken?: string;

  public toView = () => Serialize(this);
  public markDeleted = () => { this.deleteToken = uuid(); };
}
