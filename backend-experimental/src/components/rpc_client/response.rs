use actix;
use actix_web::error::ResponseError;
use actix_web::{http::StatusCode, HttpResponse};
use diesel::result::Error as DieselError;
use failure::Fail;
use futures::Future;
use std;
use std::error;
use std::fmt;

#[allow(dead_code)] // TODO: remove this
pub type Result<T> = std::result::Result<T, ApiError>;
#[allow(dead_code)] // TODO: remove this
pub type FutureResponse = Box<dyn Future<Item = HttpResponse, Error = ApiError>>;

#[derive(Serialize)]
pub struct ErrorResponse {
    pub code: String,
}

#[derive(Debug)]
pub enum ApiError {
    InternalServerError(Box<dyn error::Error + Send + Sync>),
    InternalServerErrorWithoutReason,
    ApiEndpointNotFound,
    InvalidParameters,
    NotImplemented, // TODO: drop this
}

impl ApiError {
    pub fn from_error_boxed(err: Box<dyn error::Error + Send + Sync>) -> Self {
        ApiError::InternalServerError(err)
    }
    pub fn from_error<T: 'static + error::Error + Send + Sync>(err: T) -> Self {
        ApiError::from_error_boxed(Box::new(err))
    }
    pub fn code(&self) -> &'static str {
        use self::ApiError::*;
        match self {
            InternalServerError(_) => "INTERNAL_SERVER_ERROR",
            InternalServerErrorWithoutReason => "INTERNAL_SERVER_ERROR",
            ApiEndpointNotFound => "API_ENDPOINT_NOT_FOUND",
            InvalidParameters => "INVALID_PARAMETERS",
            NotImplemented => "NOT_IMPLEMENTED",
        }
    }
    pub fn status(&self) -> StatusCode {
        use self::ApiError::*;
        match self {
            InternalServerError(_) => StatusCode::SERVICE_UNAVAILABLE,
            InternalServerErrorWithoutReason => StatusCode::SERVICE_UNAVAILABLE,
            ApiEndpointNotFound => StatusCode::INTERNAL_SERVER_ERROR,
            InvalidParameters => StatusCode::INTERNAL_SERVER_ERROR,
            NotImplemented => StatusCode::NOT_IMPLEMENTED,
        }
    }
}

impl fmt::Display for ApiError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(
            f,
            "{}",
            if let ApiError::InternalServerError(ref base_error) = self {
                format!("internal error: {}", base_error.as_ref().description())
            } else {
                format!("handled error: {}", self.code())
            }
        )
    }
}

impl error::Error for ApiError {
    fn description(&self) -> &str {
        if let ApiError::InternalServerError(ref base_error) = self {
            base_error.as_ref().description()
        } else {
            self.code()
        }
    }

    fn cause(&self) -> Option<&dyn error::Error> {
        if let ApiError::InternalServerError(ref base_error) = self {
            Some(base_error.as_ref())
        } else {
            None
        }
    }
}

impl Into<&'static str> for ApiError {
    fn into(self) -> &'static str {
        self.code()
    }
}

impl ResponseError for ApiError {
    fn error_response(&self) -> HttpResponse {
        HttpResponse::build(self.status()).json(ErrorResponse {
            code: self.code().to_owned(),
        })
    }
}

impl PartialEq<ApiError> for ApiError {
    fn eq(&self, other: &Self) -> bool {
        self.code() == other.code()
    }
}

impl From<actix::MailboxError> for ApiError {
    fn from(err: actix::MailboxError) -> Self {
        Self::from_error(err.compat())
    }
}

impl From<DieselError> for ApiError {
    fn from(err: DieselError) -> Self {
        Self::from_error(err)
    }
}
