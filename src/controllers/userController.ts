import { NextFunction, Request, Response } from 'express';
import { UserService } from '../services/index.js';
import bcrypt from 'bcrypt';
import { makeJwtToken } from '../utils/jwtTokenMaker.js';

declare global {
  namespace Express {
    interface Request {
      user_id: string;
      role: string;
    }
  }
}
interface UserLoginInfo {
  email: string;
  password: string;
}
interface updatedUser {
  user_id?: string;
  nickname?: string;
  nanoid?: string;
  introduction?: string;
  image?: string;
  phone?: string;
  role?: string;
}
interface UpdateUserInfoRequest extends Request {
  body: {
    image?: string;
    nickname?: string;
    phone?: string;
    password?: string;
    introduction?: string;
  };
}

class UserController {
  public userService = new UserService();

  //유저 생성
  public createUser = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      console.log('회원가입시작');
      const { nickname, email, password, phone } = req.body;
      const alreadyUser = await this.userService.getUserByEmail(email);
      if (alreadyUser) {
        console.log('이메일 중복으로 status 400');
        return res.status(400).json({ message: '이미 가입된 계정입니다.' });
      }

      const user = await this.userService.createUser({
        nickname,
        email,
        password,
        phone,
      });
      res.json().status(201);
      console.log('회원 가입 성공');
    } catch (error) {
      console.error(error);
      next(error);
    }
  };

  //유저 정보 조회
  public getUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('유저 정보 조회 시작');
      const { user_id } = req.params;
      const user = await this.userService.getUserById(user_id);
      res.json(user).status(200);
      console.log('회원 조회 성공');
    } catch (error) {
      console.error(error);
      next(error);
    }
  };

  //유저 로그인
  public userLogin = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { email, password } = <UserLoginInfo>req.body;
      const user = await this.userService.getUserByEmail(email);
      if (!user) {
        throw new Error(
          '해당 이메일은 가입 내역이 없습니다. 다시 한 번 확인해 주세요.',
        );
      }
      if (user.role === 'disabled') {
        throw new Error(
          '해당 계정은 탈퇴처리된 계정입니다. 관리자에게 문의하세요.',
        );
      }
      const correctPasswordHash = user.password;
      const isPasswordCorrect = await bcrypt.compare(
        password,
        correctPasswordHash,
      );
      if (!isPasswordCorrect) {
        throw new Error(
          '비밀번호가 일치하지 않습니다. 다시 한 번 확인해 주세요.',
        );
      }
      const madeToken = makeJwtToken(user);
      res.json(madeToken).status(201);
      console.log('로그인 성공');
    } catch (error) {
      console.error(error);
      next(error);
    }
  };

  public userAuthorization = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { user_id } = req.params;
      const { password } = req.body;
      const user = await this.userService.getUserPasswordById(user_id);
      if (!user) {
        throw new Error('비정상적 접근 에러');
      }
      const correctPasswordHash = user.password;
      const isPasswordCorrect = await bcrypt.compare(
        password,
        correctPasswordHash,
      );
      if (!isPasswordCorrect) {
        throw new Error(
          '비밀번호가 일치하지 않습니다. 다시 한 번 확인해 주세요.',
        );
      }
      res.status(200).json();
    } catch (error) {
      console.error(error);
      next(error);
    }
  };

  //유저 정보 수정(닉네임, 휴대전화번호 , 비밀번호)
  public updateUserInfo = async (
    req: UpdateUserInfoRequest,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      console.log('정보 수정 시작');
      const { user_id } = req.params;
      const { nickname, phone, password } = req.body;
      const updateInfo: {
        nickname?: string;
        phone?: string;
        password?: string;
      } = {};

      if (nickname) {
        updateInfo.nickname = nickname;
      }

      if (phone) {
        updateInfo.phone = phone;
      }

      if (password) {
        const newPasswordHash = await bcrypt.hash(password, 10);
        updateInfo.password = newPasswordHash;
      }
      const updatedUser = await this.userService.updateUser(
        user_id,
        updateInfo,
      );
      res.status(201).json();
      console.log('정보수정완료');
    } catch (error) {
      console.error(error);
      next(error);
    }
  };

  public updateIntroduction = async (
    req: UpdateUserInfoRequest,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { user_id } = req.params;
      const { introduction } = req.body;
      const updateInfo: {
        introduction?: string;
      } = {};

      if (introduction) {
        updateInfo.introduction = introduction;
      }

      const updatedUser = await this.userService.updateUser(
        user_id,
        updateInfo,
      );
      res.status(200).json();
      console.log('정보수정완료');
    } catch (error) {
      console.error(error);
      next(error);
    }
  };

  public updateImage = async (
    req: UpdateUserInfoRequest,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { user_id } = req.params;
      const { image } = req.body;
      const updateInfo: {
        image?: string;
      } = {};

      if (image) {
        updateInfo.image = image;
      }

      const updatedUser = await this.userService.updateUser(
        user_id,
        updateInfo,
      );
      res.status(200).json();
      console.log('정보수정완료');
    } catch (error) {
      console.error(error);
      next(error);
    }
  };

  public deleteUser = async (
    req: UpdateUserInfoRequest,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { user_id } = req.params;
      const updateInfo: updatedUser = {};
      updateInfo.role = 'disabled';

      const updatedUser = await this.userService.updateUser(
        user_id,
        updateInfo,
      );
      res.status(200).json();
      console.log('role 변경 완료');
    } catch (error) {
      console.error(error);
      next(error);
    }
  };
}

export { UserController };
