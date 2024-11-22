use diesel::Queryable;
use diesel::Selectable;
use serde::Serialize; // Importa a trait Serialize

use crate::schema::user_entity;

#[derive(Queryable, Selectable, Serialize)] // Adiciona Serialize
#[diesel(table_name = user_entity)]
pub struct User {
    pub id: i32,
    pub email: String,
    pub username: String,
    pub password: String,
}