import {
  Get,
  Controller,
  Query,
  Req,
  Res,
  Param,
  Post,
  Body,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { SessionAuth } from "../middlewares/authentication";
import { Session, Message, Subscription } from "../models";
import * as Errors from "../lib/errors";
import getPagination from "../lib/pagination";
import { classToPlain } from "class-transformer";

@Controller("messages")
class MessageController {
  @Get("mine")
  public async get(
    @SessionAuth() session: Session,
    @Req() req: any,
    @Res() res: any,
    @Query("query") query?: string,
  ): Promise<void> {
    const { skip, take } = getPagination(req);
    const where: Partial<Message> = { owner: session.user };
    if (query) {
      const filters = query.split(" ");
      for (const filter of filters) {
        const [type, param] = filter.split(":");
        switch (type) {
          case "readed": {
            where.readed = param === "true";
            break;
          }
          case "subscription": {
            if (!param) {
              throw new Errors.BadRequestError("query:query:filters:param");
            }
            const subscription = await Subscription.findOne(param);
            if (!subscription) {
              throw new Errors.BadRequestError(
                "query:query:filters:param:SUBSCRIPTION_NOT_EXISTS",
              );
            }
            where.subscription = subscription;
            break;
          }
        }
      }
    } else {
      where.readed = false;
    }
    const [messages, count] = await Message.findAndCount({
      where,
      skip,
      take,
      order: { updated_at: "DESC" },
    });
    res.set("X-Pagination-Total", count);
    res.set("X-Pagination-More", count > skip + take ? "true" : "false");
    res.send(classToPlain(messages, { version: 1.0 }));
  }
  @Get(":id")
  public async get_one(
    @SessionAuth() session: Session,
    @Param("id") id: string,
  ): Promise<Message> {
    const message = await Message.findOne(id);
    if (!message) {
      throw new Errors.MessageNotExistsError(id);
    }
    if (message.owner.id !== session.user.id) {
      throw new Errors.InsufficientPermissionError(session, "admin");
    }
    return message;
  }
  @HttpCode(HttpStatus.PARTIAL_CONTENT)
  @Post(":id")
  public async post_one(
    @SessionAuth() session: Session,
    @Param("id") id: string,
    @Body("readed") readed?: string | boolean,
  ): Promise<{ readed: boolean }> {
    const message = await Message.findOne(id);
    if (!message) {
      throw new Errors.MessageNotExistsError(id);
    }
    if (message.owner.id !== session.user.id) {
      throw new Errors.InsufficientPermissionError(session, "admin");
    }
    message.readed =
      typeof readed === "string"
        ? readed === "true"
        : readed !== undefined
          ? readed
          : false;
    await message.save();
    return { readed: message.readed };
  }
}

export default MessageController;
