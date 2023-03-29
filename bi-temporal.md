## 1. Create market_data table with triggers for update and insert
```sql
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
```

## 2. Create market_data_history table ### to track changes made to the data over time.
```sql
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[market_data_history](
	[id] [int] NOT NULL,
	[ticker] [varchar](255) NULL,
	[price] [float] NULL,
	[event_time] [datetime2](7) NULL,
	[ingestion_time] [datetime2](7) NULL,
	[event_time_start] [datetime2](7) NOT NULL,
	[event_time_end] [datetime2](7) NULL,
	[ingestion_time_start] [datetime2](7) NOT NULL,
	[ingestion_time_end] [datetime2](7) NULL
) ON [PRIMARY]
GO
ALTER TABLE [dbo].[market_data_history] ADD PRIMARY KEY CLUSTERED 
(
	[id] ASC,
	[event_time_start] ASC,
	[ingestion_time_start] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
```

## 3. Create function to retrieve the latest market data
```sql
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
--function to retrieve latest market data for a given ticker/code/symbol
CREATE FUNCTION [dbo].[latest_market_data_price] (@ticker VARCHAR(255))
RETURNS FLOAT
AS
BEGIN
    DECLARE @latest_price FLOAT;
    SELECT TOP 1 @latest_price = price
    FROM market_data
    WHERE ticker = @ticker
    ORDER BY event_time DESC, ingestion_time DESC;
    RETURN @latest_price;
   
END
GO
```

## 3. Create function to retrieve latest market data at a specific event time
```sql
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [dbo].[latest_market_data_price_cutoff] (
    @symbol VARCHAR(10),
    @cutoff_ingestion_time DATETIME2 = NULL,
    @cutoff_event_time DATETIME2 = NULL
)
RETURNS DECIMAL(18,2)
AS
BEGIN
    DECLARE @price DECIMAL(18,2)

    IF (@cutoff_ingestion_time IS NULL AND @cutoff_event_time IS NULL)
    BEGIN
        SET @price = dbo.latest_market_data_price(@symbol)
    END
    ELSE
    BEGIN
        WITH latest_market_data_cte AS (
            SELECT TOP 1 price
            FROM market_data_history
            WHERE ticker = @symbol
            AND ingestion_time <= COALESCE(@cutoff_ingestion_time, SYSDATETIME())
            AND event_time <= COALESCE(@cutoff_event_time, SYSDATETIME())
            ORDER BY ingestion_time DESC, event_time DESC
        )
        SELECT @price = latest_market_data_cte.price
        FROM latest_market_data_cte
    END

    RETURN @price
END
GO
```


