import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';

import { Public } from 'src/auth/decorators/public.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { MongoIdPipe } from 'src/mongo-id.pipe';
import {
  CreateUserDto,
  RequestResetPasswordDto,
  ResetPasswordDto,
  UpdateUserDto,
} from './dto/User.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private userService: UsersService) {}

  @Get()
  GetAllUsers() {
    return this.userService.GetAllUser();
  }

  ///////// REQUEST RESET PASSWORD ///////////////
  @Public()
  @Post('request-password')
  RequestResetPassword(@Body() requestReset: RequestResetPasswordDto) {
    return this.userService.requestResetPassword(requestReset);
  }
  ////////// RESET PASSWORD //////////
  @Public()
  @Put('reset-password')
  ResetPassword(@Body() reset: ResetPasswordDto) {
    return this.userService.resetPassword(reset);
  }
  ///////////// login aliados //////////////////
  @Public()
  @UseGuards(AuthGuard('login'))
  @Post('login')
  @ApiOperation({
    summary: ' login by email and password ',
  })
  login(@Req() req: Request) {
    const user = req.user;
    return user;
  }

  @Get(':id')
  Getone(@Param('id', MongoIdPipe) iduser: string) {
    return this.userService.GetOne(iduser);
  }

  @Post('create')
  CreateUser(@Body() user: CreateUserDto) {
    return this.userService.CreateUser(user);
  }

  @Put(':id')
  UpdateUser(
    @Param('id', MongoIdPipe) idUser: string,
    @Body() user: UpdateUserDto,
  ) {
    return this.userService.UpdateUser(idUser, user);
  }

  @Delete(':id')
  DeleteUser(@Param('id', MongoIdPipe) idUser: string) {
    return this.userService.DeleteUser(idUser);
  }
}
