from pydantic import BaseModel

class AgreementRequest(BaseModel):
    landlord_name: str
    tenant_name: str
    property_address: str
    rent_amount: int
    start_date: str
    end_date: str