Create market_data table with triggers for update and insert
```
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[market_data](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[ticker] [varchar](255) NULL,
	[price] [float] NULL,
	[event_time] [datetime2](7) NULL,
	[ingestion_time] [datetime2](7) NULL
) ON [PRIMARY]
GO
ALTER TABLE [dbo].[market_data] ADD PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE TRIGGER [dbo].[trg_market_data_insert] ON [dbo].[market_data]
FOR INSERT
AS
BEGIN
    INSERT INTO market_data_history (id, ticker, price, event_time, ingestion_time, event_time_start, ingestion_time_start)
    SELECT id, ticker, price, event_time, ingestion_time, event_time, ingestion_time FROM inserted;
END;
GO
ALTER TABLE [dbo].[market_data] ENABLE TRIGGER [trg_market_data_insert]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE TRIGGER [dbo].[trg_market_data_update] ON [dbo].[market_data]
FOR UPDATE
AS
BEGIN
    UPDATE market_data_history
    SET event_time_end = i.event_time, ingestion_time_end = i.ingestion_time
    FROM market_data_history h
    INNER JOIN inserted i ON h.id = i.id AND h.event_time_end IS NULL
    WHERE h.price <> i.price;
    
    INSERT INTO market_data_history (id, ticker, price, event_time, ingestion_time, event_time_start, ingestion_time_start, event_time_end, ingestion_time_end)
    SELECT i.id, i.ticker, i.price, i.event_time, i.ingestion_time, h.event_time_end, h.ingestion_time_end, i.event_time, i.ingestion_time
    FROM inserted i
    LEFT JOIN market_data_history h ON i.id = h.id AND h.event_time_end IS NULL
    WHERE i.price <> COALESCE(h.price, i.price);
END;
GO
ALTER TABLE [dbo].[market_data] ENABLE TRIGGER [trg_market_data_update]
GO
