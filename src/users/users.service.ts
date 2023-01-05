import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import * as bcrypt from 'bcrypt';
import {
  CreateUserDto,
  RequestResetPasswordDto,
  ResetPasswordDto,
  UpdateUserDto,
} from './dto/User.dto';
import { Users } from './entities/users.entity';
import { PayloadToken } from 'src/auth/models/token.model';
import { JwtService } from '@nestjs/jwt';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const nodemailer = require('nodemailer');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const axios = require('axios');

@Injectable()
export class UsersService {
  constructor(
    @InjectModel('User') private readonly usersModel: Model<Users>,
    private jwtService: JwtService,
  ) {}

  async GetAllUser(): Promise<Users[]> {
    return await this.usersModel.find({}).populate('roleId').exec();
  }

  async GetOne(id: string): Promise<Users> {
    const users = await this.usersModel.findById(id).exec();
    if (!users) {
      throw new NotFoundException(`users #${id} not found`);
    }

    return users;
  }

  async CreateUser(data: CreateUserDto) {
    const userExist = await this.usersModel.findOne({ email: data.email });
    if (userExist) {
      return 'user Exist';
    }
    const newUser = await new this.usersModel(data);
    const hashPassword = await bcrypt.hash(newUser.password, 10);
    newUser.password = hashPassword;
    const model = await newUser.save();
    const { password, ...rta } = model.toJSON();
    return rta;

    // ASIGNAR ROLE
  }

  async UpdateUser(id: string, changes: UpdateUserDto) {
    const user = await this.usersModel
      .findByIdAndUpdate(id, { $set: changes }, { new: true })
      .exec();
    const model = await user.save();
    const { password, ...rta } = model.toJSON();
    if (changes.password) {
      const hashPassword = await bcrypt.hash(user.password, 10);
      user.password = hashPassword;
      return rta;
    }
    if (!user) {
      throw new NotFoundException(`user -> ${id} not found`);
    }
    return rta;
  }

  async DeleteUser(id: string) {
    return await this.usersModel.findByIdAndRemove(id);
  }
  async validateUser(email: string, password: string) {
    const mensajeError = {
      statusCode: 401,
      message: 'correo o contraseña invalido!!',
      error: 'Unauthorized',
    };

    const user = await this.findByEmail(email);

    if (!user) {
      return mensajeError;
    }
    if (user) {
      const access_token = this.generateJWT(user);
      const isMatch = await bcrypt.compare(password, user.password);
      if (isMatch) {
        const { password, ...rta } = user.toJSON();

        const response = {
          access_token: access_token,
          id: rta._id,
          email: rta.email,
        };

        return response;
      }

      return mensajeError;
    }
    return null;
  }

  /////////////////////////////// LOGIN ALIADOS ////////////////////////////////////////////////
  async findByEmail(email: string) {
    const user = await this.usersModel
      .findOne({ email: email })
      .populate('profileId');
    if (!user) {
      throw new NotFoundException(`user whith email -> ${email} not found`);
    }
    return user;
  }
  async findByPhone(phone: string) {
    return await this.usersModel.findOne({ phone: phone });
  }

  //////////////////////////////////// RESET PASSWORD ////////////////////////////////////////
  async requestResetPassword(requestReset: RequestResetPasswordDto) {
    const user = await this.findByEmail(requestReset.email);
    const { randomBytes } = await import('crypto');

    const code = randomBytes(3).toString('hex');
    user.resetPasswordToken = code;
    const saveUser = await user.save();
    return await this.sendEmail(saveUser.email, saveUser.resetPasswordToken);
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const hashPassword = await bcrypt.hash(resetPasswordDto.password, 10);
    const user = await this.findByResetPasswordToken(
      resetPasswordDto.resetPasswordToken,
    );
    user.password = hashPassword;
    user.resetPasswordToken = null;
    const model = await user.save();
    const { password, ...rta } = model.toJSON();
    return rta;
  }

  async findByResetPasswordToken(resetPasswordToken: string) {
    const user = await this.usersModel.findOne({
      resetPasswordToken: resetPasswordToken,
    });
    if (!user) {
      throw new NotFoundException(`code -> ${resetPasswordToken} not found`);
    }
    return user;
  }
  //////////////////////////// VALIDATE USER WITH TRUORA//////////////////////////////////////

  //////////////////////////// Generate Token ///////////////////////////////
  generateJWT(user: Users) {
    const payload: PayloadToken = {
      email: user.email,
      id: user._id,
    };
    return this.jwtService.sign(payload);
  }

  ///////////////////////// SEND EMAIL BY NODEMAILER /////////////////////////////////
  async sendEmail(email: string, resetPasswordToken: string) {
    const user = await this.findByEmail(email);
    if (!user) return 'user don´t exist';
    const fullName = user.name + ' ' + user.lastName;

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      secure: true, // true for 465, false for other ports
      port: 465, // 587 para demo
      auth: {
        user: process.env.USER_GMAIL,
        pass: process.env.PASSWORD_GMAIL,
      },
    });

    const info = await transporter.sendMail({
      from: 'diegosoft84@gmail.com', // sender address
      to: email, // list of receivers
      subject: 'REESTABLECER CONTRASEÑA ', // Subject line
      text: `Hello ${fullName}`, // plain text body
      html: `<p>
          Hola ${fullName} este es tu token para validar tu solicitud de cambio de contraseña: <b>${resetPasswordToken}</b>
          <br/>
          </p>`, // html body
    });
    console.log('Message sent: %s', info.messageId);
    // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

    // Preview only available when sending through an Ethereal account
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
    return 'revisa tu correo';
  }
}
