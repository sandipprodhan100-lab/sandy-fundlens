from .connection import Base, engine, get_db, SessionLocal
from .models import Fund, NavHistory, SidewaysWindow, FundRanking, AgentThread, AgentMessage, AgentDigest, AdminSetting

def init_db():
    Base.metadata.create_all(bind=engine)
