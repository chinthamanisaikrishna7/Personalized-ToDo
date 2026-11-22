-- Run in SQL Server Management Studio connected to the target SQL Server instance.
-- Creates the database and table only when they do not already exist.
-- Existing tables are left unchanged; this is not a schema migration tool.
USE master;
GO
IF DB_ID(N'CqrsTodo') IS NULL
    EXEC(N'CREATE DATABASE [CqrsTodo]');
GO
USE [CqrsTodo];
GO
IF OBJECT_ID(N'dbo.Todos', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Todos (
        Id uniqueidentifier NOT NULL CONSTRAINT PK_Todos PRIMARY KEY,
        Title nvarchar(200) NOT NULL,
        Description nvarchar(max) NULL,
        IsCompleted bit NOT NULL,
        CreatedAt datetime2 NOT NULL
    );
END;
GO
