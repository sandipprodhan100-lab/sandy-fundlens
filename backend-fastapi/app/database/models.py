import uuid
from sqlalchemy import Column, String, Integer, Float, Date, DateTime, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from .connection import Base

class Fund(Base):
    __tablename__ = "funds"
    
    scheme_code = Column(Integer, primary_key=True, index=True)
    scheme_name = Column(String, nullable=False)
    fund_house = Column(String, nullable=False)
    category = Column(String, nullable=False, index=True)
    
    nav_history = relationship("NavHistory", back_populates="fund", cascade="all, delete-orphan")
    rankings = relationship("FundRanking", back_populates="fund", cascade="all, delete-orphan")


class NavHistory(Base):
    __tablename__ = "nav_history"
    
    id = Column(Integer, primary_key=True, index=True)
    scheme_code = Column(Integer, ForeignKey("funds.scheme_code", ondelete="CASCADE"), nullable=False, index=True)
    nav_date = Column(Date, nullable=False, index=True)
    nav = Column(Float, nullable=False)
    
    fund = relationship("Fund", back_populates="nav_history")


class SidewaysWindow(Base):
    __tablename__ = "sideways_windows"
    
    id = Column(Integer, primary_key=True, index=True)
    index_code = Column(Integer, nullable=False, index=True)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    days = Column(Integer, nullable=False)
    drift = Column(Float, nullable=False)
    band = Column(Float, nullable=False)
    
    rankings = relationship("FundRanking", back_populates="window", cascade="all, delete-orphan")


class FundRanking(Base):
    __tablename__ = "fund_rankings"
    
    id = Column(Integer, primary_key=True, index=True)
    window_id = Column(Integer, ForeignKey("sideways_windows.id", ondelete="CASCADE"), nullable=False, index=True)
    scheme_code = Column(Integer, ForeignKey("funds.scheme_code", ondelete="CASCADE"), nullable=False, index=True)
    returns = Column(Float, nullable=False)
    annualised = Column(Float, nullable=False)
    max_drawdown = Column(Float, nullable=False)
    volatility = Column(Float, nullable=False)
    alpha = Column(Float, nullable=True)
    sortino = Column(Float, nullable=True)
    treynor = Column(Float, nullable=True)
    
    window = relationship("SidewaysWindow", back_populates="rankings")
    fund = relationship("Fund", back_populates="rankings")


class AgentThread(Base):
    __tablename__ = "agent_threads"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, nullable=False, index=True)
    title = Column(String, default="New analysis")
    created_at = Column(DateTime, nullable=False)
    updated_at = Column(DateTime, nullable=False)
    
    messages = relationship("AgentMessage", back_populates="thread", cascade="all, delete-orphan")


class AgentMessage(Base):
    __tablename__ = "agent_messages"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    thread_id = Column(String, ForeignKey("agent_threads.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String, nullable=False)
    role = Column(String, nullable=False)  # 'user' or 'assistant'
    parts = Column(JSON, nullable=False)
    created_at = Column(DateTime, nullable=False)
    
    thread = relationship("AgentThread", back_populates="messages")


class AgentDigest(Base):
    __tablename__ = "agent_digests"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    digest_date = Column(Date, nullable=False, index=True)
    category = Column(String, nullable=False, index=True)
    headline = Column(String, nullable=False)
    body = Column(String, nullable=False)
    facts = Column(JSON, default=dict)
    created_at = Column(DateTime, nullable=False)


class AdminSetting(Base):
    __tablename__ = "admin_settings"
    
    key = Column(String, primary_key=True, index=True)
    value = Column(String, nullable=False)

