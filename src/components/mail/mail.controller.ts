import { Controller, Route, Tags, Post, Body, Get, Request, Security, Put, Query, Path, Delete } from "tsoa";
import { successResponse, failedResponse, IListResponse } from "../../utils/http";
import Mail from "./mail.model";
import { IMail } from "./mail.types";



@Route("Mails")
@Tags("Mails")
export class MailController extends Controller {

    @Post("create-mail")
    public async createMail(@Body() data: IMail): Promise<any> {
        try {
            const mail = await Mail.create(data);
            return successResponse(mail);
        } catch (err) {
            this.setStatus(500);
            return failedResponse('Execute service went wrong', 'ServiceException');
        }
    }
}
