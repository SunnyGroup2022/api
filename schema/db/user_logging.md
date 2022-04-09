## Name
    會員統計資料(user_logging)

## Description
    * 會員統計數據資料表

## Fields
 Field | Type | Not Null | Default | Description | note
 --------------- | --------------- | --------------- | --------------- | -------------------- | --------------------
 id | serial | V || 紀錄編號 | Auto Increment
 type | smallint | V || 類型 | 1: session 紀錄
 user_id | int | V | 1 | 會員編號 |
 date | timestamp | V || 紀錄日期
 count | smallint | V | 1 | 會員當日上線次數 |
 
## Fields Logic

## PRIMARY KEY
 Name | Field | Remarks
 --------------- | --------------- | ---------------
 id | id | 

## UNIQUE KEY
 Name | Field | Remarks
 --------------- | --------------- | ---------------
 user_id_date | user_id, date | 

## Relations
 Name | Field | Reference Table | Reference Field | Remarks
 --------------- | --------------- | --------------- | --------------- | ---------------
 user_id | user_id | user | id | 

## INDEX
 Name | Field | Remarks
 --------------- | --------------- | ---------------
 user_id_date | user_id, date | 