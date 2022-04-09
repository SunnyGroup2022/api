## Name
    登入方式資料(connection)

## Description
    * 登入方式資料表

## Fields
 Field | Type | Not Null | Default | Description | note
 --------------- | --------------- | --------------- | --------------- | -------------------- | --------------------
 id | serial | V || 登入方去編號 | Auto Increment
 name | varchar(255) ||| 登入方式名稱 |
 status | boolean | V | 1 | 登入方式狀態（0: 關閉, 1: 開啟） |
 
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