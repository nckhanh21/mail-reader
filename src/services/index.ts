const { authenticate, getAllEmails, getAllGmails } = require("./mail-service");

export const getEmails = async () => {
    authenticate().then((auth: any) => {
        console.log("Đã xác thực thành công11");
        getAllEmails(auth).then((emails: any) => {
            console.log("Danh sách email:", emails);
        }).catch((error: any) => {
            console.log("Lỗi khi lấy danh sách email:", error);
        });
    }).catch((error: any) => {
        console.log("Xác thực thất bại:", error);
    });

    // getAllGmails().then((emails: any) => {
    //     return emails;
    // }).catch((error: any) => {
    //     console.log("Lỗi khi lấy danh sách email:", error);
    //     return error;
    // }
    // );

}

export const queryAllGmails = async () => {
    return await getAllGmails()
}



