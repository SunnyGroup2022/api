## Name
    會員登入方式(user_connection)

## Description
    * 會員登入方式資料表

## Fields
 Field | Type | Not Null | Default | Description | note
 --------------- | --------------- | --------------- | --------------- | -------------------- | --------------------
 id | serial | V || 會員登入方式編號 | Auto Increment
 user_id | integer | V || 會員編號 | 
 connection_id | integer | V || 登入方式編號 | 
 account | varchar(255) | V || 會員登入方式的編號（不同登入方式，編號也不同） |
 verified | smallint | V | 0 | 驗證狀態 | 0: 未驗證, 1: 已驗證
 created_on | timestamp | V || 建立時間 | 
 info | json ||| 使用者資訊 | 第三方回傳的用戶資料
  
## Fields Logic

## PRIMARY KEY
 Name | Field | Remarks
 --------------- | --------------- | ---------------
 id | id |

## UNIQUE KEY
 Name | Field | Remarks
 --------------- | --------------- | ---------------
 id | id |
 user_id, connection_id | user_id, connection_id |
 connection_id, account | connection_id, account |
 
## Relations
 Name | Field | Reference Table | Reference Field | Remarks
 --------------- | --------------- | --------------- | --------------- | ---------------
 userId | user_id | user | id | 
 connectionId | connection_id | connection | id | 

## INDEX
 Name | Field | Remarks
 --------------- | --------------- | ---------------
 id | id |