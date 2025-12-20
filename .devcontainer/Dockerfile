FROM mcr.microsoft.com/devcontainers/typescript-node:1-22-bookworm

RUN apt-get update && \
    apt-get install -y curl build-essential libssl-dev pkg-config && \
    apt-get install -y pandoc && \
    apt-get install ripgrep && \
    apt-get install fzf && \
    rm -rf /var/lib/apt/lists/*

RUN git config --global user.name "J Wynia" && \
    git config --global user.email "j@wynia.org" && \
    git config --global init.defaultBranch main

RUN npm install -g deno
RUN npm install -g bun

# Install Rust and Cargo using rustup
# IMPORTANT: Install as 'node' user (not root) so cargo is accessible in the container
# The container runs as 'node' user, so Rust must be installed in /home/node/.cargo
USER node
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y

# Add Cargo's bin directory to the PATH for the node user
ENV PATH="/home/node/.cargo/bin:${PATH}"

# Install Rust-based CLI tools as node user
RUN cargo install cargo-binstall
RUN cargo binstall ripgrep fd-find bat ast-grep
RUN cargo binstall --strategies crate-meta-data jj-cli

RUN cargo binstall oxdraw
RUN cargo install --git https://github.com/yshavit/mdq

RUN ln -s $(which fdfind) /usr/local/bin/fd || true

USER root
RUN npm install -g opencode-ai
RUN npm install -g @anthropic-ai/claude-code