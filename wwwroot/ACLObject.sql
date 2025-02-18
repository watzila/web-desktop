/*
   2025年2月18日下午 03:41:44
   使用者: sa
   伺服器: YDPC01\SQLEXPRESS
   資料庫: Backstage
   應用程式: 
*/

/* 為了避免任何可能發生資料遺失的問題，您應該先詳細檢視此指令碼，然後才能在資料庫設計工具環境以外的位置執行。*/
BEGIN TRANSACTION
SET QUOTED_IDENTIFIER ON
SET ARITHABORT ON
SET NUMERIC_ROUNDABORT OFF
SET CONCAT_NULL_YIELDS_NULL ON
SET ANSI_NULLS ON
SET ANSI_PADDING ON
SET ANSI_WARNINGS ON
COMMIT
BEGIN TRANSACTION
GO
ALTER TABLE dbo.ACLObject ADD
	Width float(53) NOT NULL CONSTRAINT DF_ACLObject_Width DEFAULT 900,
	Height float(53) NOT NULL CONSTRAINT DF_ACLObject_Height DEFAULT 600
GO
DECLARE @v sql_variant 
SET @v = N'寬'
EXECUTE sp_addextendedproperty N'MS_Description', @v, N'SCHEMA', N'dbo', N'TABLE', N'ACLObject', N'COLUMN', N'Width'
GO
DECLARE @v sql_variant 
SET @v = N'高'
EXECUTE sp_addextendedproperty N'MS_Description', @v, N'SCHEMA', N'dbo', N'TABLE', N'ACLObject', N'COLUMN', N'Height'
GO
ALTER TABLE dbo.ACLObject SET (LOCK_ESCALATION = TABLE)
GO
COMMIT
