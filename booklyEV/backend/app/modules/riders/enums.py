import enum


class KycStatus(str, enum.Enum):
    NOT_STARTED = "NOT_STARTED"
    PENDING = "PENDING"
    VERIFIED = "VERIFIED"
    REJECTED = "REJECTED"


class KycDocumentType(str, enum.Enum):
    DRIVING_LICENSE = "DRIVING_LICENSE"
    AADHAAR = "AADHAAR"
    PAN = "PAN"
    VEHICLE_INSURANCE = "VEHICLE_INSURANCE"
    OTHER = "OTHER"


class KycDocumentStatus(str, enum.Enum):
    PENDING = "PENDING"
    VERIFIED = "VERIFIED"
    REJECTED = "REJECTED"


class BookingStatus(str, enum.Enum):
    PENDING = "PENDING"
    ACTIVE = "ACTIVE"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class TripStatus(str, enum.Enum):
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class JobStatus(str, enum.Enum):
    OPEN = "OPEN"
    ACCEPTED = "ACCEPTED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class EarningStatus(str, enum.Enum):
    ACCRUED = "ACCRUED"
    PAID = "PAID"
