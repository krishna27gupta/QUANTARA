from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import Boolean, DateTime, Decimal, ForeignKey, String, Text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    email: Mapped[str] = mapped_column(
        String(255), unique=True, nullable=False, index=True
    )
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    profile: Mapped["Profile"] = relationship(
        back_populates="user", cascade="all, delete-orphan", uselist=False
    )
    portfolios: Mapped[list["Portfolio"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    paper_trades: Mapped[list["PaperTrade"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    subscriptions: Mapped[list["Subscription"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    conversations: Mapped[list["Conversation"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    memories: Mapped[list["Memory"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )


class Profile(Base):
    __tablename__ = "profiles"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    full_name: Mapped[str | None] = mapped_column(String(150))
    avatar_url: Mapped[str | None] = mapped_column(String(255))
    subscription_status: Mapped[str] = mapped_column(String(50), default="free")
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    user: Mapped["User"] = relationship(back_populates="profile")


class Stock(Base):
    __tablename__ = "stocks"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    ticker: Mapped[str] = mapped_column(
        String(10), unique=True, nullable=False, index=True
    )
    company_name: Mapped[str] = mapped_column(String(255), nullable=False)
    exchange: Mapped[str] = mapped_column(String(50), default="NSE")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    # Relationships
    market_data: Mapped[list["MarketData"]] = relationship(
        back_populates="stock", cascade="all, delete-orphan"
    )
    predictions: Mapped[list["Prediction"]] = relationship(
        back_populates="stock", cascade="all, delete-orphan"
    )
    recommendations: Mapped[list["Recommendation"]] = relationship(
        back_populates="stock", cascade="all, delete-orphan"
    )
    holdings: Mapped[list["Holding"]] = relationship(back_populates="stock")
    paper_trades: Mapped[list["PaperTrade"]] = relationship(back_populates="stock")


class MarketData(Base):
    __tablename__ = "market_data"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    stock_id: Mapped[UUID] = mapped_column(
        ForeignKey("stocks.id", ondelete="CASCADE"), nullable=False
    )
    open_price: Mapped[Decimal] = mapped_column(Decimal(12, 2), nullable=False)
    close_price: Mapped[Decimal] = mapped_column(Decimal(12, 2), nullable=False)
    high_price: Mapped[Decimal] = mapped_column(Decimal(12, 2), nullable=False)
    low_price: Mapped[Decimal] = mapped_column(Decimal(12, 2), nullable=False)
    volume: Mapped[int] = mapped_column(nullable=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime, nullable=False, index=True)

    # Relationships
    stock: Mapped["Stock"] = relationship(back_populates="market_data")


class Prediction(Base):
    __tablename__ = "predictions"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    stock_id: Mapped[UUID] = mapped_column(
        ForeignKey("stocks.id", ondelete="CASCADE"), nullable=False
    )
    prediction_date: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, index=True
    )
    target_price: Mapped[Decimal] = mapped_column(Decimal(12, 2), nullable=False)
    confidence_score: Mapped[Decimal] = mapped_column(
        Decimal(5, 2), nullable=False
    )  # e.g. 0.00 to 100.00
    direction: Mapped[str] = mapped_column(
        String(20), nullable=False
    )  # Bullish, Bearish, Neutral
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    stock: Mapped["Stock"] = relationship(back_populates="predictions")


class Recommendation(Base):
    __tablename__ = "recommendations"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    stock_id: Mapped[UUID] = mapped_column(
        ForeignKey("stocks.id", ondelete="CASCADE"), nullable=False
    )
    recommendation_type: Mapped[str] = mapped_column(
        String(10), nullable=False
    )  # BUY, SELL, HOLD
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    score: Mapped[Decimal] = mapped_column(Decimal(5, 2), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    stock: Mapped["Stock"] = relationship(back_populates="recommendations")


class Portfolio(Base):
    __tablename__ = "portfolios"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    cash_balance: Mapped[Decimal] = mapped_column(Decimal(15, 2), default=0.00)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    user: Mapped["User"] = relationship(back_populates="portfolios")
    holdings: Mapped[list["Holding"]] = relationship(
        back_populates="portfolio", cascade="all, delete-orphan"
    )


class Holding(Base):
    __tablename__ = "holdings"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    portfolio_id: Mapped[UUID] = mapped_column(
        ForeignKey("portfolios.id", ondelete="CASCADE"), nullable=False
    )
    stock_id: Mapped[UUID] = mapped_column(ForeignKey("stocks.id"), nullable=False)
    shares: Mapped[Decimal] = mapped_column(Decimal(12, 4), nullable=False)
    average_buy_price: Mapped[Decimal] = mapped_column(Decimal(12, 2), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    portfolio: Mapped["Portfolio"] = relationship(back_populates="holdings")
    stock: Mapped["Stock"] = relationship(back_populates="holdings")


class PaperTrade(Base):
    __tablename__ = "paper_trades"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    stock_id: Mapped[UUID] = mapped_column(ForeignKey("stocks.id"), nullable=False)
    action: Mapped[str] = mapped_column(String(10), nullable=False)  # BUY, SELL
    quantity: Mapped[Decimal] = mapped_column(Decimal(12, 4), nullable=False)
    execution_price: Mapped[Decimal] = mapped_column(Decimal(12, 2), nullable=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    user: Mapped["User"] = relationship(back_populates="paper_trades")
    stock: Mapped["Stock"] = relationship(back_populates="paper_trades")


class Subscription(Base):
    __tablename__ = "subscriptions"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    plan_name: Mapped[str] = mapped_column(
        String(50), nullable=False
    )  # Starter, Pro, Enterprise
    price: Mapped[Decimal] = mapped_column(Decimal(10, 2), default=0.00)
    status: Mapped[str] = mapped_column(
        String(50), default="active"
    )  # active, inactive, trialing
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    user: Mapped["User"] = relationship(back_populates="subscriptions")


class Conversation(Base):
    __tablename__ = "conversations"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    title: Mapped[str] = mapped_column(String(255), default="New Chat Conversation")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    user: Mapped["User"] = relationship(back_populates="conversations")
    memories: Mapped[list["Memory"]] = relationship(
        back_populates="conversation", cascade="all, delete-orphan"
    )


class Memory(Base):
    __tablename__ = "memories"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    conversation_id: Mapped[UUID] = mapped_column(
        ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False
    )
    key: Mapped[str] = mapped_column(String(100), nullable=False)
    value: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    user: Mapped["User"] = relationship(back_populates="memories")
    conversation: Mapped["Conversation"] = relationship(back_populates="memories")
