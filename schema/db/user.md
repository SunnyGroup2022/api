## Name
    會員資料(user)

## Description
    * 會員資料表

## Fields
 Field | Type | Not Null | Default | Description | note
 --------------- | --------------- | --------------- | --------------- | -------------------- | --------------------
 id | serial | V || 會員編號 | Auto Increment
 name | varchar(255) ||| 會員姓名 |
 email | varchar(255) | V || 會員電子郵件 |
 password | varchar(255) ||| 會員密碼 |
 email_verified | smallint | V | 0 | 電子郵件驗證狀態（0:未驗證, 1:已驗證） |
 verify_code | varchar(50) ||| 驗證碼 | 驗證信箱用的隨機碼
 logins | integer | V | 0 | 會員登入次數 | 
 created_on | timestamp | V || 會員註冊時間 | 
 last_login | timestamp ||| 會員最後登入時間 | 
 last_online | timestamp ||| 會員最後活動時間 | 

## Fields Logic

## PRIMARY KEY
 Name | Field | Remarks
 --------------- | --------------- | ---------------
 id | id |

## UNIQUE KEY
 Name | Field | Remarks
 --------------- | --------------- | ---------------
 id | id |
 
## Relations
 Name | Field | Reference Table | Reference Field | Remarks
 --------------- | --------------- | --------------- | --------------- | ---------------

## INDEX
 Name | Field | Remarks
 --------------- | --------------- | ---------------
 id | id |


## 初始設定
 CREATE OR REPLACE FUNCTION set_created_on()
    RETURNS trigger AS
 $$
 BEGIN
    NEW.created_on = NOW();
    RETURN NEW;
 END;
 $$ LANGUAGE plpgsql;

 CREATE TRIGGER user_created_on
 BEFORE INSERT ON public."user"
 FOR EACH ROW
 EXECUTE PROCEDURE set_created_on();