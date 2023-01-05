import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({
  timestamps: true,
})
export class Users extends Document {
  @Prop({ unique: true, type: String })
  email: string;

  @Prop()
  password: string;

  @Prop({ unique: true, type: String })
  userName: string;

  @Prop()
  name: string;

  @Prop()
  lastName: string;

  @Prop({ type: String, default: 'null' })
  resetPasswordToken: string;
}

export const UserSchema = SchemaFactory.createForClass(Users);
